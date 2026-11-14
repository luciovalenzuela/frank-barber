import { gallery, instagramLink, site } from "@/content/site";
import { Photo } from "@/components/ui/Photo";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function Gallery() {
  return (
    <section id="galeria" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHeading eyebrow="Galería" title="Nuestro trabajo" />

        <ul className="mt-14 grid auto-rows-[10rem] grid-cols-2 gap-3 sm:auto-rows-[13rem] md:grid-cols-4 md:gap-4">
          {gallery.map((item, index) => (
            <li key={index} className={item.tall ? "row-span-2" : ""}>
              <Reveal delay={(index % 4) * 80} className="h-full">
                <Photo src={item.src} alt={item.alt} className="h-full" />
              </Reveal>
            </li>
          ))}
        </ul>

        <Reveal className="mt-10 text-center">
          <a
            href={instagramLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-gold underline-offset-4 hover:underline"
          >
            Ver más en Instagram · @{site.contact.instagramUser}
          </a>
        </Reveal>
      </div>
    </section>
  );
}
