"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { bookAppointment } from "@/app/reservar/actions";
import { formatPrice, type Barber, type Service } from "@/content/site";
import { ANY_BARBER, type DayAvailability } from "@/lib/booking/availability";
import { buttonClasses } from "@/components/ui/Button";

type BookingFormProps = {
  services: Service[];
  barbers: Pick<Barber, "id" | "name" | "role">[];
};

/** El recorrido: qué te hacés → cuándo → con quién → a nombre de quién. */
const STEPS = ["Servicio", "Día y hora", "Barbero", "Tus datos"] as const;

const fieldClasses =
  "mt-2 w-full rounded-md border border-line bg-ink px-4 py-3 text-base text-cream placeholder:text-sand/50 focus:border-gold focus:outline-none";

const optionClasses = (selected: boolean) =>
  `rounded-lg border transition-colors ${
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

const DAY_PARTS = [
  { label: "Mañana", from: "00:00", to: "12:00" },
  { label: "Tarde", from: "12:00", to: "18:00" },
  { label: "Noche", from: "18:00", to: "24:00" },
];

function StepHeading({ title, lead }: { title: string; lead: string }) {
  return (
    <>
      <h2 className="font-display text-3xl text-cream">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-sand">{lead}</p>
    </>
  );
}

export function BookingForm({ services, barbers }: BookingFormProps) {
  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [days, setDays] = useState<DayAvailability[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [barberId, setBarberId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // Si el cliente cambia de servicio rápido, solo vale la respuesta del último pedido.
  const lastRequest = useRef(0);
  const topRef = useRef<HTMLDivElement>(null);

  /** Cambia de paso y, si la barra de pasos quedó arriba fuera de la pantalla, vuelve a ella. */
  function goTo(next: number) {
    setStep(next);
    requestAnimationFrame(() => {
      const top = topRef.current;
      if (top && top.getBoundingClientRect().top < 0) top.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  const service = services.find((item) => item.id === serviceId);
  const selectedDay = days?.find((day) => day.date === date);
  const selectedSlot = selectedDay?.slots.find((slot) => slot.time === time);
  const barber = barbers.find((item) => item.id === barberId);
  const barberLabel = barberId === ANY_BARBER ? "El primero disponible" : barber?.name;
  const hasAnySlot = days?.some((day) => day.slots.length > 0) ?? false;

  /** Hasta qué paso se puede saltar desde la barra de pasos. */
  const reachable = !service ? 0 : !time ? 1 : !barberId ? 2 : 3;

  async function loadAvailability(nextServiceId: string) {
    const request = ++lastRequest.current;
    setLoading(true);
    setLoadError(null);

    try {
      const response = await fetch(`/api/disponibilidad?${new URLSearchParams({ servicio: nextServiceId })}`);
      const body = await response.json();
      if (request !== lastRequest.current) return;
      if (!response.ok) throw new Error(body.error);

      const nextDays: DayAvailability[] = body.days;
      setDays(nextDays);
      // Se mantiene el día elegido si sigue teniendo lugar; si no, el primero con horarios.
      setDate((current) => {
        const stillOpen = nextDays.some((day) => day.date === current && day.slots.length > 0);
        return stillOpen ? current : (nextDays.find((day) => day.slots.length > 0)?.date ?? null);
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
    // Cambiar de servicio cambia la duración, así que los horarios se eligen de nuevo.
    if (id !== serviceId) {
      setServiceId(id);
      setDays(null);
      setTime(null);
      setBarberId(null);
      void loadAvailability(id);
    }
    setFormError(null);
    goTo(1);
  }

  function chooseTime(slot: string) {
    setTime(slot);
    setBarberId(null);
    setFormError(null);
    goTo(2);
  }

  function chooseBarber(id: string) {
    setBarberId(id);
    setFormError(null);
    goTo(3);
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
      if (error.code === "slot_taken") {
        // El horario se ocupó mientras completaba los datos: vuelve a elegir con la agenda al día.
        setTime(null);
        setBarberId(null);
        goTo(1);
        await loadAvailability(serviceId);
      }
    });
  }

  return (
    <div ref={topRef} className="scroll-mt-4">
      <ol className="flex border-b border-line">
        {STEPS.map((label, index) => {
          const current = index === step;
          const done = index < step;
          return (
            <li key={label} className="flex-1">
              <button
                type="button"
                disabled={index > reachable}
                aria-current={current ? "step" : undefined}
                onClick={() => goTo(index)}
                className={`-mb-px flex w-full items-center justify-center gap-2 border-b-2 px-1 py-3 text-xs font-bold uppercase tracking-[0.12em] transition-colors disabled:cursor-not-allowed sm:text-sm ${
                  current
                    ? "border-gold text-cream"
                    : done
                      ? "border-transparent text-gold hover:text-gold-soft"
                      : "border-transparent text-sand/60"
                }`}
              >
                <span
                  className={`inline-flex size-6 shrink-0 items-center justify-center rounded-full text-xs tabular-nums ${
                    current ? "bg-gold text-ink" : done ? "border border-gold" : "border border-line"
                  }`}
                >
                  {done ? "✓" : index + 1}
                </span>
                <span className={current ? "" : "hidden sm:inline"}>{label}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
        <div className="min-w-0">
          {formError ? (
            <p role="alert" className="mb-6 rounded-md border border-red-400/50 bg-red-950/40 p-3 text-sm text-red-100">
              {formError}
            </p>
          ) : null}

          {step === 0 ? (
            <section>
              <StepHeading
                title="¿Qué te hacemos hoy?"
                lead="Todos los servicios incluyen asesoramiento: lo charlamos en el sillón antes de empezar."
              />
              <ul className="mt-6 space-y-3">
                {services.map((item) => {
                  const selected = item.id === serviceId;
                  return (
                    <li key={item.id} className={`${optionClasses(selected)} p-5`}>
                      <div className="flex items-baseline justify-between gap-4">
                        <h3 className="font-display text-2xl text-cream">{item.name}</h3>
                        <p className="shrink-0 text-lg font-bold tabular-nums text-gold">{formatPrice(item.priceArs)}</p>
                      </div>
                      <p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-cream/60">
                        {item.durationMinutes} min
                      </p>
                      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-sand">
                        {item.includes.map((extra) => (
                          <li key={extra} className="flex gap-2">
                            <span aria-hidden="true" className="text-gold">
                              ·
                            </span>
                            {extra}
                          </li>
                        ))}
                      </ul>
                      <details className="mt-3 text-sm">
                        <summary className="cursor-pointer text-cream/80 underline-offset-4 hover:text-gold hover:underline">
                          Más información
                        </summary>
                        <p className="mt-2 leading-relaxed text-sand">{item.description}</p>
                      </details>
                      <button
                        type="button"
                        onClick={() => chooseService(item.id)}
                        className={buttonClasses(selected ? "primary" : "outline", "mt-4 cursor-pointer px-5 py-2.5 text-xs")}
                      >
                        {selected ? "Elegido · continuar" : "Elegir"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          {step === 1 ? (
            <section>
              <StepHeading
                title="¿Cuándo venís?"
                lead="Estos son los horarios con lugar. En el paso siguiente elegís con quién."
              />
              <div className="mt-6">
                {loadError ? (
                  <div role="alert" className="text-sm text-cream">
                    <p>{loadError}</p>
                    <button
                      type="button"
                      onClick={() => serviceId && void loadAvailability(serviceId)}
                      className="mt-3 font-semibold text-gold underline-offset-4 hover:underline"
                    >
                      Reintentar
                    </button>
                  </div>
                ) : !days ? (
                  <p className="text-sm text-sand">Buscando horarios…</p>
                ) : !hasAnySlot ? (
                  <p className="text-sm text-cream">
                    No quedan horarios en las próximas semanas para este servicio. Escribinos por WhatsApp y lo vemos.
                  </p>
                ) : (
                  <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"} aria-busy={loading}>
                    <ul className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-3 lg:mx-0 lg:px-0">
                      {days.map((day, index) => {
                        const full = day.slots.length === 0;
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
                                setBarberId(null);
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
                      <div className="mt-6 space-y-6">
                        <p className="text-sm font-semibold text-cream first-letter:uppercase">
                          {longDayFormat.format(asDate(selectedDay.date))}
                        </p>
                        {DAY_PARTS.map((part) => {
                          const slots = selectedDay.slots.filter((slot) => slot.time >= part.from && slot.time < part.to);
                          if (slots.length === 0) return null;
                          return (
                            <div key={part.label}>
                              <h3 className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.25em] text-gold">
                                {part.label}
                                <span aria-hidden="true" className="h-px flex-1 bg-line" />
                              </h3>
                              <ul className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
                                {slots.map((slot) => (
                                  <li key={slot.time}>
                                    <button
                                      type="button"
                                      aria-pressed={slot.time === time}
                                      onClick={() => chooseTime(slot.time)}
                                      className={`${optionClasses(slot.time === time)} w-full py-2.5 text-center text-sm font-semibold tabular-nums`}
                                    >
                                      {slot.time}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </section>
          ) : null}

          {step === 2 && selectedSlot ? (
            <section>
              <StepHeading
                title="¿Con quién te atendés?"
                lead="Si te da lo mismo, te recibe el primero que esté libre a esa hora."
              />
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {[{ id: ANY_BARBER, name: "Sin preferencia", role: "El primero disponible" }, ...barbers].map((item) => {
                  const free = item.id === ANY_BARBER || selectedSlot.barberIds.includes(item.id);
                  const selected = item.id === barberId;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        disabled={!free}
                        aria-pressed={selected}
                        onClick={() => chooseBarber(item.id)}
                        className={`${optionClasses(selected)} flex w-full items-center gap-4 p-4 text-left disabled:cursor-not-allowed disabled:border-line/50 disabled:bg-transparent disabled:opacity-50`}
                      >
                        <span
                          aria-hidden="true"
                          className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-leather font-display text-xl text-gold"
                        >
                          {item.id === ANY_BARBER ? "FB" : item.name[0]}
                        </span>
                        <span>
                          <span className="block font-semibold text-cream">{item.name}</span>
                          <span className="mt-0.5 block text-sm text-sand">
                            {free ? item.role : `Ocupado a las ${time}`}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          {step === 3 && service && date && time && barberId ? (
            <section>
              <StepHeading
                title="¿A nombre de quién?"
                lead="Te mandamos la confirmación por email, con un link para cancelar si no podés venir."
              />
              <form onSubmit={handleSubmit} className="mt-6">
                <input type="hidden" name="servicio" value={service.id} />
                <input type="hidden" name="barbero" value={barberId} />
                <input type="hidden" name="fecha" value={date} />
                <input type="hidden" name="hora" value={time} />

                <div className="grid gap-5 sm:grid-cols-2">
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
                  Usamos tus datos solo para gestionar tus turnos.
                </p>

                <button
                  type="submit"
                  disabled={pending}
                  className={buttonClasses("primary", "mt-6 w-full cursor-pointer disabled:cursor-wait disabled:opacity-60 sm:w-auto")}
                >
                  {pending ? "Reservando…" : "Confirmar turno"}
                </button>
              </form>
            </section>
          ) : null}

          {step > 0 ? (
            <button
              type="button"
              onClick={() => goTo(step - 1)}
              className="mt-8 text-sm font-semibold text-cream/70 underline-offset-4 hover:text-gold hover:underline"
            >
              ← Volver
            </button>
          ) : null}
        </div>

        {/* Resumen del turno: arriba en el celular, al costado en pantallas grandes. */}
        {service ? (
          <aside className="order-first rounded-lg border border-line bg-coal p-4 lg:sticky lg:p-5 lg:top-6 lg:order-last">
            <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-gold">Tu turno</h2>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="sr-only">Servicio</dt>
                <dd className="flex items-baseline justify-between gap-3">
                  <span className="font-semibold text-cream">{service.name}</span>
                  <span className="shrink-0 font-bold tabular-nums text-gold">{formatPrice(service.priceArs)}</span>
                </dd>
                <dd className="text-sand">{service.durationMinutes} min</dd>
              </div>
              {date && time ? (
                <div className="border-t border-line/60 pt-3">
                  <dt className="sr-only">Día y hora</dt>
                  <dd className="text-cream first-letter:uppercase">{longDayFormat.format(asDate(date))}</dd>
                  <dd className="text-sand">{time} hs</dd>
                </div>
              ) : null}
              {barberLabel ? (
                <div className="border-t border-line/60 pt-3">
                  <dt className="text-sand">Te atiende</dt>
                  <dd className="text-cream">{barberLabel}</dd>
                </div>
              ) : null}
            </dl>
            <p className="mt-4 hidden border-t border-line/60 pt-3 text-xs leading-relaxed text-sand lg:block">
              Mientras esperás, el café va por nuestra cuenta.
            </p>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
