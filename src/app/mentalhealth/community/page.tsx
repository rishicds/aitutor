import CommunityChat from "../components/CommunityChat";

export default function CommunityPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center">
        Community Forum
      </h1>
      <p className="text-center mb-6">
        Connect with others, share experiences, and support each other on your
        mental wellness journey.
      </p>
      <CommunityChat />
    </div>
  );
}
