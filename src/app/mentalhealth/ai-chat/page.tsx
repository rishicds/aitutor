import AIChat from "../components/AIChat";

export default function AIChatPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center">
        AI Chat Support
      </h1>
      <p className="text-center mb-6">
        Get immediate assistance and guidance from our AI-powered support
        system.
      </p>
      <AIChat />
    </div>
  );
}
