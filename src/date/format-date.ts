export function formatDate(
  date: Date | string | number,
  locale: Intl.LocalesArgument = "pt-BR",
  opts: Intl.DateTimeFormatOptions = {},
) {
  return new Intl.DateTimeFormat(locale as any, {
    month: opts.month ?? "long",
    day: opts.day ?? "numeric",
    year: opts.year ?? "numeric",
    ...opts,
  }).format(new Date(date))
}
