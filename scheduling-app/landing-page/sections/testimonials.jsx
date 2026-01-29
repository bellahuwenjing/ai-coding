import SectionTitle from "@/components/section-title";
import { motion } from "framer-motion";
import { useRef } from "react";

export default function Testimonials() {

    const ref = useRef([]);
    const data = [
        {
            review: 'SchedulePro eliminated our double-booking nightmare. We used to waste hours fixing scheduling conflicts — now it just works.',
            name: 'Sarah Chen',
            about: 'Operations Manager',
            rating: 5,
            image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face',
        },
        {
            review: 'Finally, one place to see all our trucks and crew. The drag-and-drop interface is so intuitive my team learned it in minutes.',
            name: 'Marcus Johnson',
            about: 'Fleet Manager',
            rating: 5,
            image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
        },
        {
            review: 'We manage 200+ employees across 3 locations. SchedulePro handles it all without breaking a sweat.',
            name: 'Emily Rodriguez',
            about: 'HR Director',
            rating: 5,
            image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face',
        },
        {
            review: 'The real-time sync is a game-changer. Our field teams always know exactly where they need to be.',
            name: 'David Park',
            about: 'Project Manager',
            rating: 5,
            image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
        },
        {
            review: 'Cut our scheduling time by 70%. What used to take a full day now takes an hour.',
            name: 'Lisa Thompson',
            about: 'Owner, Thompson Construction',
            rating: 5,
            image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
        },
        {
            review: 'Best investment we made this year. ROI was positive within the first month.',
            name: 'James Wilson',
            about: 'COO',
            rating: 5,
            image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face',
        },
    ];
    return (
        <section className="mt-32 flex flex-col items-center">
            <SectionTitle
                title="Trusted by operations teams everywhere"
                description="See why hundreds of companies switched to SchedulePro."
            />
            <div className='mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
                {data.map((item, index) => (
                    <motion.div key={index} className='w-full max-w-88 space-y-5 rounded-lg glass p-5 hover:-translate-y-1'
                        initial={{ y: 150, opacity: 0 }}
                        ref={(el) => (ref.current[index] = el)}
                        whileInView={{ y: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: `${index * 0.15}`, type: "spring", stiffness: 320, damping: 70, mass: 1 }}
                        onAnimationComplete={() => {
                            const card = ref.current[index];
                            if (card) {
                                card.classList.add("transition", "duration-300");
                            }
                        }}
                    >
                        <div className='flex items-center justify-between'>
                            <p className="font-medium">{item.about}</p>
                            <img className='size-10 rounded-full' src={item.image} alt={item.name} />
                        </div>
                        <p className='line-clamp-3'>“{item.review}”</p>
                        <p className='text-gray-300'>
                            - {item.name}
                        </p>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}