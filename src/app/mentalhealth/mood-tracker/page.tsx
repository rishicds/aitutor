import MoodTracker from "../components/MoodTracker";

export default function MoodTrackerPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center">
        Mood Tracker
      </h1>
      <MoodTracker />
    </div>
  );
}
