import GuidedJournal from "../components/GuidedJournal";

export default function JournalPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center">
        Guided Journal
      </h1>
      <GuidedJournal />
    </div>
  );
}
