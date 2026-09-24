import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts"
import { calculateNextOccurrence, isDue } from "./notificationDateUtils.ts"

Deno.test("mantem o horario fixo de Brasilia ao avancar uma recorrencia mensal", () => {
  const next = calculateNextOccurrence("monthly", new Date("2026-01-31T12:00:00-03:00"), { interval: 1, day_of_month: 31 })
  assertEquals(next?.toISOString(), "2026-02-28T15:00:00.000Z")
})

Deno.test("ajusta dias uteis e ignora fim de semana", () => {
  const next = calculateNextOccurrence("business_days", new Date("2026-09-25T12:00:00-03:00"), { interval: 1 })
  assertEquals(next?.toISOString(), "2026-09-28T15:00:00.000Z")
})

Deno.test("aceita atraso dentro da tolerancia do processador", () => {
  assert(isDue(new Date(Date.now() + 4 * 60 * 1000)))
  assert(!isDue(new Date(Date.now() + 6 * 60 * 1000)))
})

Deno.test("calcula ocorrencia semanal em dia selecionado", () => {
  const next = calculateNextOccurrence("weekly", new Date("2026-09-24T09:00:00-03:00"), { interval: 1, weekdays: [1, 3, 5] })
  assertEquals(next?.toISOString(), "2026-09-25T12:00:00.000Z")
})