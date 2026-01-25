import SectionTitle from '@/components/section-title';
import { ChevronDownIcon } from 'lucide-react';
import { useState } from 'react';
import { motion } from "framer-motion";

export default function FaqSection() {
    const [isOpen, setIsOpen] = useState(false);
    const data = [
        {
            question: 'How long does it take to set up SchedulePro?',
            answer: 'Most teams are up and running in under 30 minutes. Simply add your resources, set their availability, and start scheduling.',
        },
        {
            question: 'Can I import my existing data?',
            answer: 'Yes! You can import resources via CSV or connect directly to your HR system. We also offer free migration assistance for Pro and Enterprise plans.',
        },
        {
            question: 'What types of resources can I schedule?',
            answer: 'SchedulePro handles people (employees, contractors), vehicles (trucks, vans, equipment), and assets (tools, rooms, machinery) — all in one unified calendar.',
        },
        {
            question: 'Is my data secure?',
            answer: 'Absolutely. We use bank-level encryption, regular backups, and are SOC 2 compliant. Your data is isolated per company and never shared.',
        },
        {
            question: 'Can my team access schedules on mobile?',
            answer: 'Yes, SchedulePro works on any device. Your team can view their schedules, receive notifications, and update availability from their phones.',
        },
        {
            question: 'What happens if I exceed my plan limits?',
            answer: "We'll notify you when you're approaching limits. You can upgrade anytime, and we prorate the difference. No surprises.",
        },
    ];

    return (
        <section className='mt-32'>
            <SectionTitle title="Frequently Asked Questions" description="Got questions? We've got answers." />
            <div className='mx-auto mt-12 space-y-4 w-full max-w-xl'>
                {data.map((item, index) => (
                    <motion.div key={index} className='flex flex-col glass rounded-md'
                        initial={{ y: 150, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: `${index * 0.15}`, type: "spring", stiffness: 320, damping: 70, mass: 1 }}
                    >
                        <h3 className='flex cursor-pointer hover:bg-white/10 transition items-start justify-between gap-4 p-4 font-medium' onClick={() => setIsOpen(isOpen === index ? null : index)}>
                            {item.question}
                            <ChevronDownIcon className={`size-5 transition-all shrink-0 duration-400 ${isOpen === index ? 'rotate-180' : ''}`} />
                        </h3>
                        <p className={`px-4 text-sm/6 transition-all duration-400 overflow-hidden ${isOpen === index ? 'pt-2 pb-4 max-h-80' : 'max-h-0'}`}>{item.answer}</p>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}