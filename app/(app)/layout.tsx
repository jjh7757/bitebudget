import { BottomNav } from "@/components/layout/BottomNav";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col pb-24">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
