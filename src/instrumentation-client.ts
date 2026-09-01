/**
 * Next 16 + React 19 can emit a negative performance timestamp when Turbopack
 * interrupts a dynamic prerender (for example, through notFound()). Keep this
 * guard development-only and narrow to that framework error.
 *
 * See: https://github.com/vercel/next.js/issues/86060
 */
if (process.env.NODE_ENV === "development") {
  const nativeMeasure = performance.measure.bind(performance);

  performance.measure = ((...args: Parameters<typeof performance.measure>) => {
    try {
      return nativeMeasure(...args);
    } catch (error) {
      if (error instanceof Error && error.message.includes("negative time stamp")) {
        return undefined as never;
      }
      throw error;
    }
  }) as typeof performance.measure;
}
