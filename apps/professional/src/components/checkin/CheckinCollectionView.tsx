"use client";

import {
  BarStrip,
  MetaStrip,
  RadarChart,
  ScaleRow,
  SectionIndex,
  StatBlock,
  daysBetween,
  eachDay,
  formatDay,
  formatDayShort,
  pluralize,
  type RadarAxis,
} from "@sinapsa/ui";
import type {
  CheckinCollection,
  CheckinCollectionCheckin,
} from "@sinapsa/api-client";

/* A leitura do check-in na hora da sessão.

   Ordem deliberada: forma, número, extremos, calendário. O radar responde
   "como foi o período" num relance; as escalas devolvem a precisão que o
   radar não tem; os extremos apontam onde perguntar; a faixa de dias mostra
   a adesão, que é o que qualifica todo o resto.

   Duas regras de linguagem que valem para a seção inteira:

   - o que está aqui é relato, não medida. "3,4 de 5 em humor relatado" é
     permitido; "humor 68%" não é.
   - a média nunca aparece sem os dias que a sustentam. Onze dias e três dias
     produzem o mesmo desenho e não significam a mesma coisa. */

const NUMBER = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function axesOf(checkin: CheckinCollectionCheckin): RadarAxis[] {
  return checkin.questions.map((question, index) => ({
    id: question.question_id,
    index: String(index + 1).padStart(2, "0"),
    label: question.prompt,
    value: question.normalized,
    display: `${NUMBER.format(question.average)} de ${question.score_max}`,
  }));
}

function CheckinReading({
  checkin,
  periodStart,
  periodEnd,
}: {
  checkin: CheckinCollectionCheckin;
  periodStart: string;
  periodEnd: string;
}) {
  const answered = checkin.answered_day_count;
  const axes = axesOf(checkin);

  // O calendário completo do período: um dia sem resposta precisa ocupar
  // lugar na régua, senão a faixa mente sobre a adesão.
  // A régua é o período pedido, não o intervalo entre a primeira e a última
  // resposta: um começo ou um fim sem registro também é adesão.
  const byDate = new Map(checkin.days.map((day) => [day.date, day]));
  const points = eachDay(periodStart, periodEnd).map((date) => ({
    label: formatDayShort(date),
    value: byDate.get(date)?.average ?? 0,
  }));

  const singleDay =
    checkin.best_day && checkin.worst_day
      ? checkin.best_day.date === checkin.worst_day.date
      : false;

  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h3 className="font-editorial text-h3 text-balance text-primary">
          {checkin.title}
        </h3>
        <MetaStrip
          items={[
            // Quem autorou um check-in de outro acompanhamento não é nomeado:
            // a existência desse vínculo é informação do paciente.
            checkin.authored_by_you
              ? "check-in enviado por você"
              : "check-in de outro profissional",
            `${pluralize(answered, "dia respondido", "dias respondidos")} de ${checkin.period_day_count}`,
          ]}
        />
      </header>

      {answered === 0 ? (
        <p className="measure text-body text-secondary">
          Nenhum dia respondido neste período. Não há médias a mostrar — e a
          ausência de registro não é, por si só, informação sobre a pessoa.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:gap-10">
            <RadarChart
              axes={axes}
              label={`Média relatada por pergunta em ${checkin.title}, escala de 1 a 5, ${pluralize(
                answered,
                "dia respondido",
                "dias respondidos",
              )}`}
              className="md:shrink-0"
            />

            <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-6 gap-y-6">
              <StatBlock
                size="sm"
                label="Média do período"
                value={NUMBER.format(checkin.average)}
                context="de 5, no que foi relatado"
              />
              <StatBlock
                size="sm"
                label="Dias respondidos"
                value={`${answered}/${checkin.period_day_count}`}
                context="base de tudo nesta seção"
              />
              {checkin.best_day && (
                <StatBlock
                  size="sm"
                  label={singleDay ? "Único dia" : "Dia mais alto"}
                  value={formatDayShort(checkin.best_day.date)}
                  context={`${NUMBER.format(checkin.best_day.average)} de 5`}
                />
              )}
              {checkin.worst_day && !singleDay && (
                <StatBlock
                  size="sm"
                  label="Dia mais baixo"
                  value={formatDayShort(checkin.worst_day.date)}
                  context={`${NUMBER.format(checkin.worst_day.average)} de 5`}
                />
              )}
            </div>
          </div>

          {/* O radar dá a forma; a escala devolve o número e os extremos —
              é o que impede a média de ser lida como nota. */}
          <div className="flex flex-col divide-y divide-hairline border-y border-hairline">
            {checkin.questions.map((question, index) => (
              <ScaleRow
                key={question.question_id}
                index={String(index + 1).padStart(2, "0")}
                label={question.prompt}
                value={question.normalized}
                display={NUMBER.format(question.average)}
                scale={[String(question.score_min), String(question.score_max)]}
                answerCount={pluralize(
                  question.answer_count,
                  "dia respondido",
                  "dias respondidos",
                )}
              />
            ))}
          </div>

          {points.length > 1 && (
            <div className="flex flex-col gap-3">
              <p className="type-eyebrow text-tertiary">Dia a dia</p>
              <BarStrip
                points={points}
                label={`Média relatada por dia em ${checkin.title}. Dias sem barra não foram respondidos.`}
              />
              <p className="type-meta text-tertiary">
                Barras vazias são dias sem resposta, não dias ruins.
              </p>
            </div>
          )}

          {singleDay && (
            <p className="type-meta measure text-tertiary">
              Só um dia foi respondido neste período: não há variação a
              comparar, e a média é a resposta desse dia.
            </p>
          )}
        </>
      )}
    </article>
  );
}

export function CheckinCollectionView({
  collection,
  index,
}: {
  collection: CheckinCollection;
  index?: string;
}) {
  return (
    <section className="flex flex-col gap-8">
      <SectionIndex
        index={index}
        meta={`${daysBetween(collection.period_start, collection.period_end)} dias`}
      >
        Check-in diário
      </SectionIndex>

      <p className="type-display text-h1-system text-primary">
        {formatDayShort(collection.period_start)} {formatDay(collection.period_end)}
      </p>

      <MetaStrip
        items={[
          `enviado pela pessoa em ${formatDay(collection.shared_at.slice(0, 10))}`,
          pluralize(collection.checkins.length, "check-in", "check-ins"),
          "respostas declaradas, sem interpretação",
        ]}
      />

      <div className="flex flex-col gap-14">
        {collection.checkins.map((checkin) => (
          <CheckinReading
            key={checkin.assignment_id}
            checkin={checkin}
            periodStart={collection.period_start}
            periodEnd={collection.period_end}
          />
        ))}
      </div>
    </section>
  );
}
