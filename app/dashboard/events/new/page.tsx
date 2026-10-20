import { EventForm } from '@/components/events/EventForm';

export default function NewEventPage() {
    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-neutral-900">Create Event</h1>
                <p className="text-neutral-500 mt-1">Set up a new event with locations and categories</p>
            </div>
            <EventForm />
        </div>
    );
}