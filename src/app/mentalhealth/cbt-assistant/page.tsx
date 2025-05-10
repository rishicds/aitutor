import CBTAssistant from "../components/CBTAssistant";

export default function CBTAssistantPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center">
        CBT Assistant
      </h1>
      <p className="text-center mb-6">
        Use this CBT assistant to help identify and challenge negative thoughts.
      </p>
      <CBTAssistant />
    </div>
  );
}
