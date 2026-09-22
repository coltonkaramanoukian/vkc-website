import { approvedClients } from "@/lib/content";

/** D3. Approved clients only; an empty list renders no section at all. */
export function ClientList({ heading }: { heading: string }) {
  const clients = approvedClients();
  if (clients.length === 0) return null;
  return (
    <section className="wrap mt-20" aria-labelledby="clients-heading">
      <h2 id="clients-heading">{heading}</h2>
      <ul className="mt-6 flex flex-wrap gap-3">
        {clients.map((client) => (
          <li key={client.name} className="placard px-4 py-3">
            {client.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={client.logo} alt={client.name} className="h-10 w-auto" loading="lazy" />
            ) : (
              <span className="font-semibold">{client.name}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
