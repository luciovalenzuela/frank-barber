"use client";

import { useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { bookAppointment } from "@/app/reservar/actions";
import { formatPrice, type Barber, type Service } from "@/content/site";
import { ANY_BARBER, type DayAvailability } from "@/lib/booking/availability";
import { buttonClasses } from "@/components/ui/Button";

type BookingFormProps = {
  services: Service[];
  barbers: Pick<Barber, "id" | "name">[];
};

const fieldClasses =
  "mt-2 w-full rounded-md border border-line bg-ink px-4 py-3 text-base text-cream placeholder:text-sand/50 focus:border-gold focus:outline-none";

const optionClasses = (selected: boolean) =>
  `rounded-lg border text-left transition-colors ${
    selected ? "border-gold bg-leather text-cream" : "border-line bg-coal text-cream/85 hover:border-gold/60"
  }`;

// Las fechas llegan como YYYY-MM-DD: se formatean al mediodía UTC para que
// el huso horario del dispositivo no las corra de día.
const asDate = (date: string) => new Date(`${date}T12:00:00Z`);
const weekdayFormat = new Intl.DateTimeFormat("es-AR", { timeZone: "UTC", weekday: "short" });
const monthFormat = new Intl.DateTimeFormat("es-AR", { timeZone: "UTC", month: "short" });
const longDayFormat = new Intl.DateTimeFormat("es-AR", {
  timeZone: "UTC",
  weekday: "long",
  day: "numeric",
  month: "long",
});

function Step({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line pt-8">
      <h2 className="flex items-baseline gap-3 font-display text-2xl text-cream">
        <span className="text-sm font-bold tabular-nums text-gold">{number}</span>
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function BookingForm({ services, barbers }: BookingFormProps) {
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [barberId, setBarberId] = useState<string | null>(null);
  const [days, setDays] = useState<DayAvailability[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // Si el cliente cambia de opción rápido, solo vale la respuesta del último pedido.
  const lastRequest = useRef(0);

  const service = services.find((item) => item.id === serviceId);
  const barberName =
    barberId === ANY_BARBER ? "el primer barbero disponible" : barbers.find((item) => item.id === barberId)?.name;
  const selectedDay = days?.find((day) => day.date === date);
  const hasAnySlot = days?.some((day) => day.times.length > 0) ?? false;

  async function loadAvailability(nextServiceId: string, nextBarberId: string) {
    const request = ++lastRequest.current;
    setLoading(true);
    setLoadError(null);
    setTime(null);

    try {
      const query = new URLSearchParams({ servicio: nextServiceId, barbero: nextBarberId });
      const response = await fetch(`/api/disponibilidad?${query}`);
      const body = await response.json();
      if (request !== lastRequest.current) return;
      if (!response.ok) throw new Error(body.error);

      const nextDays: DayAvailability[] = body.days;
      setDays(nextDays);
      // Se mantiene el día elegido si sigue teniendo lugar; si no, el primero con horarios.
      setDate((current) => {
        const stillOpen = nextDays.some((day) => day.date === current && day.times.length > 0);
        return stillOpen ? current : (nextDays.find((day) => day.times.length > 0)?.date ?? null);
      });
    } catch {
      if (request !== lastRequest.current) return;
      setDays(null);
      setLoadError("No pudimos cargar los horarios. Revisá tu conexión y probá de nuevo.");
    } finally {
      if (request === lastRequest.current) setLoading(false);
    }
  }

  function chooseService(id: string) {
    setServiceId(id);
    setFormError(null);
    if (barberId) void loadAvailability(id, barberId);
  }

  function chooseBarber(id: string) {
    setBarberId(id);
    setFormError(null);
    if (serviceId) void loadAvailability(serviceId, id);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!serviceId || !barberId || !date || !time) return;

    const formData = new FormData(event.currentTarget);
    setFormError(null);

    startTransition(async () => {
      // Si sale bien, la acción redirige a la página del turno y no devuelve nada.
      const error = await bookAppointment(formData);
      if (!error) return;
      setFormError(error.message);
      if (error.code === "slot_taken") await loadAvailability(serviceId, barberId);
    });
  }

  return (
    <div className="space-y-10">
      <Step number={1} title="Elegí el servicio">
        <ul className="grid gap-3 sm:grid-cols-2">
          {services.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                aria-pressed={item.id === serviceId}
                onClick={() => chooseService(item.id)}
                className={`${optionClasses(item.id === serviceId)} flex w-full items-baseline justify-between gap-4 p-4`}
              >
                <span>
                  <span className="block font-semibold">{item.name}</span>
                  <span className="mt-1 block text-sm text-sand">{item.durationMinutes} min</span>
                </span>
                <span className="shrink-0 font-bold tabular-nums text-gold">{formatPrice(item.priceArs)}</span>
              </button>
            </li>
          ))}
        </ul>
      </Step>

      <Step number={2} title="Elegí con quién">
        <ul className="flex flex-wrap gap-3">
          {[{ id: ANY_BARBER, name: "Sin preferencia" }, ...barbers].map((item) => (
            <li key={item.id}>
              <button
                type="button"
                aria-pressed={item.id === barberId}
                onClick={() => chooseBarber(item.id)}
                className={`${optionClasses(item.id === barberId)} px-5 py-3 font-semibold`}
              >
                {item.name}
              </button>
            </li>
          ))}
        </ul>
      </Step>

      <Step number={3} title="Elegí día y horario">
        {!serviceId || !barberId ? (
          <p className="text-sm text-sand">Primero elegí el servicio y con quién querés atenderte.</p>
        ) : loadError ? (
          <div role="alert" className="text-sm text-cream">
            <p>{loadError}</p>
            <button
              type="button"
              onClick={() => void loadAvailability(serviceId, barberId)}
              className="mt-3 font-semibold text-gold underline-offset-4 hover:underline"
            >
              Reintentar
            </button>
          </div>
        ) : !days ? (
          <p className="text-sm text-sand">Buscando horarios…</p>
        ) : !hasAnySlot ? (
          <p className="text-sm text-cream">
            No quedan horarios en las próximas semanas para esta combinación. Probá con otro barbero o con “Sin
            preferencia”.
          </p>
        ) : (
          <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"} aria-busy={loading}>
            <ul className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-3">
              {days.map((day, index) => {
                const full = day.times.length === 0;
                const selected = day.date === date;
                const parsed = asDate(day.date);
                return (
                  <li key={day.date} className="shrink-0">
                    <button
                      type="button"
                      disabled={full}
                      aria-pressed={selected}
                      aria-label={`${longDayFormat.format(parsed)}${full ? ", sin horarios" : ""}`}
                      onClick={() => {
                        setDate(day.date);
                        setTime(null);
                      }}
                      className={`${optionClasses(selected)} flex w-16 flex-col items-center px-2 py-3 disabled:cursor-not-allowed disabled:border-line/50 disabled:bg-transparent disabled:text-sand/40`}
                    >
                      <span className="text-[0.65rem] font-bold uppercase tracking-wider">
                        {index === 0 ? "Hoy" : weekdayFormat.format(parsed).replace(".", "")}
                      </span>
                      <span className="mt-1 text-xl font-bold tabular-nums">{parsed.getUTCDate()}</span>
                      <span className="text-[0.65rem] uppercase text-sand">
                        {monthFormat.format(parsed).replace(".", "")}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {selectedDay ? (
              <>
                <p className="mt-5 text-sm text-sand first-letter:uppercase">
                  {longDayFormat.format(asDate(selectedDay.date))}
                </p>
                <ul className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {selectedDay.times.map((slot) => (
                    <li key={slot}>
                      <button
                        type="button"
                        aria-pressed={slot === time}
                        onClick={() => {
                          setTime(slot);
                          setFormError(null);
                        }}
                        className={`${optionClasses(slot === time)} w-full py-2.5 text-center text-sm font-semibold tabular-nums`}
                      >
                        {slot}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
        )}
      </Step>

      <Step number={4} title="Tus datos">
        {!service || !date || !time ? (
          <p className="text-sm text-sand">Elegí un horario para completar la reserva.</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <input type="hidden" name="servicio" value={serviceId ?? ""} />
            <input type="hidden" name="barbero" value={barberId ?? ""} />
            <input type="hidden" name="fecha" value={date} />
            <input type="hidden" name="hora" value={time} />

            <p className="rounded-lg border border-gold/50 bg-leather p-4 text-sm leading-relaxed text-cream">
              <span className="font-semibold">{service.name}</span> con {barberName}
              <br />
              <span className="first-letter:uppercase">{longDayFormat.format(asDate(date))}</span> a las {time} hs ·{" "}
              <span className="font-semibold text-gold">{formatPrice(service.priceArs)}</span>
            </p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-medium text-cream sm:col-span-2">
                Nombre y apellido
                <input name="nombre" type="text" required minLength={2} maxLength={80} autoComplete="name" className={fieldClasses} />
              </label>
              <label className="block text-sm font-medium text-cream">
                Email
                <input name="email" type="email" required maxLength={120} autoComplete="email" className={fieldClasses} />
              </label>
              <label className="block text-sm font-medium text-cream">
                Teléfono
                <input name="telefono" type="tel" required maxLength={25} autoComplete="tel" className={fieldClasses} />
              </label>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-sand">
              Te mandamos la confirmación por email, con un link para cancelar si no podés venir. Usamos tus datos
              solo para gestionar tus turnos.
            </p>

            {formError ? (
              <p role="alert" className="mt-5 rounded-md border border-red-400/50 bg-red-950/40 p-3 text-sm text-red-100">
                {formError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={pending}
              className={buttonClasses("primary", "mt-6 w-full cursor-pointer disabled:cursor-wait disabled:opacity-60 sm:w-auto")}
            >
              {pending ? "Reservando…" : "Confirmar turno"}
            </button>
          </form>
        )}
      </Step>
    </div>
  );
}
