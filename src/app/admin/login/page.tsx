import { LoginForm } from "@/components/admin/login-form";

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-16">
      <div className="space-y-2 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-qc">VKC Packaging</p>
        <h1 className="text-2xl font-semibold text-ink">Content editor</h1>
        <p className="text-sm text-graphite">Owner access only. Sign in to edit the site’s contact details, capabilities and client list.</p>
      </div>
      <div className="mt-10 rounded-2xl border border-hairline bg-label p-6 sm:p-8">
        <LoginForm />
      </div>
    </main>
  );
}
