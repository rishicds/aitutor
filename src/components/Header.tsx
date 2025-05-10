import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  const getTitle = () => {
    switch (pathname) {
      case "/mentalhealth":
        return "Mental Health";
      case "/mentalhealth/resources":
        return "Resources";
      case "/mentalhealth/profile":
        return "Profile";
      default:
        return "Mental Health";
    }
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <h1 className="text-xl font-semibold text-gray-900">{getTitle()}</h1>
          <div className="flex items-center space-x-4">
            {/* Add any header actions here */}
          </div>
        </div>
      </div>
    </header>
  );
}
