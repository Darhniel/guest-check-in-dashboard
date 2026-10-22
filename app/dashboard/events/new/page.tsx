import { PageHeader } from '@/components/layout/PageHeader';
import { EventForm } from '@/components/events/EventForm';

export default function NewEventPage() {
    return (
        <div className="space-y-5 sm:space-y-6">
            <div className="animate-enter">
                <PageHeader
                    backHref="/dashboard/events"
                    backLabel="All events"
                    eyebrow="New"
                    title="Create event"
                    description="Set the dates, accreditation points, and guest tiers. You can assign ambassadors once the event exists."
                />
            </div>
            <EventForm />
        </div>
    );
}
