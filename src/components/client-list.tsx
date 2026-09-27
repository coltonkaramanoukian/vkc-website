import { approvedClients } from "@/lib/content";
import { localImageSize } from "@/lib/local-image";

/** Width and height attributes from the logo file's header; nothing when it cannot be read. */
function logoBox(src: string): { width: number; height: number } | Record<string, never> {
  const size = localImageSize(src);
  return size ? { width: size.width, height: size.height } : {};
}

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
              // Width and height from the file's header reserve the logo's box
              // before it loads; the CSS keeps the rendered height at h-10.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={client.logo}
                alt={client.name}
                {...logoBox(client.logo)}
                className="h-10 w-auto"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <span className="font-semibold">{client.name}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
