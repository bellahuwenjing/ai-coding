const { verifyToken } = require('../../middleware/auth.middleware');

// Mock the entire supabase service module
jest.mock('../../services/supabase.service', () => ({
  supabaseAuth: {
    auth: {
      getUser: jest.fn(),
    },
  },
  supabaseAdmin: {
    from: jest.fn(),
  },
}));

const { supabaseAuth, supabaseAdmin } = require('../../services/supabase.service');

describe('verifyToken middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  describe('when no token is provided', () => {
    it('returns 401 with no Authorization header', async () => {
      await verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'error',
        message: 'No token provided. Please login.',
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when Authorization header is not Bearer format', async () => {
      req.headers.authorization = 'Basic sometoken';

      await verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('when token is invalid', () => {
    it('returns 401 when Supabase returns an error', async () => {
      req.headers.authorization = 'Bearer invalid-token';
      supabaseAuth.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid JWT' },
      });

      await verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'error',
        message: 'Invalid or expired token. Please login again.',
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when Supabase returns no user', async () => {
      req.headers.authorization = 'Bearer expired-token';
      supabaseAuth.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('when token is valid', () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockPerson = { id: 'person-456', company_id: 'company-789' };

    beforeEach(() => {
      req.headers.authorization = 'Bearer valid-token';
      supabaseAuth.auth.getUser.mockResolvedValue({
        data: { user: { ...mockUser } }, // spread to avoid mutation between tests
        error: null,
      });
    });

    it('attaches user, person_id, and company_id to req when person record found', async () => {
      supabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockPerson, error: null }),
      });

      await verifyToken(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user.id).toBe('user-123');
      expect(req.user.person_id).toBe('person-456');
      expect(req.user.company_id).toBe('company-789');
    });

    it('calls next without company_id when person record not found', async () => {
      supabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      await verifyToken(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user.id).toBe('user-123');
      expect(req.user.company_id).toBeUndefined();
    });

    it('still calls next even if person lookup throws', async () => {
      supabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      });

      await verifyToken(req, res, next);

      // No person found due to error, but user is valid so next() is still called
      expect(next).toHaveBeenCalled();
    });
  });
});
