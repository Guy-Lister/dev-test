import { Button } from "@/shared/components/ui/button";
import Link from "next/link";

const WelcomeMessage = ({
  name,
  signOut,
}: {
  name: string;
  signOut: () => void;
}) => {
  return (
    <>
      <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
        Welcome <span className="text-[hsl(280,100%,70%)]">{name}</span>!
      </h1>
      <p className="mb-6 text-gray-400">
        Click &quot;Demo SSE&quot; to test real-time notifications and upload
        progress tracking
      </p>
      <div className="flex flex-col items-center gap-3">
        <Link href="/sse-demo">
          <Button variant="default" className="w-40">
            Demo SSE
          </Button>
        </Link>
        <Button onClick={signOut} variant="secondary" className="w-40">
          Sign out
        </Button>
      </div>
    </>
  );
};

export default WelcomeMessage;
