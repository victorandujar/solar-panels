export async function getMessages(locale: string, notFound: () => void) {
  try {
    return (await import(`../../../messages/${locale}.json`)).default;
  } catch (error) {
    if (error) {
      notFound();
    }
  }
}
