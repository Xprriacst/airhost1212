export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  const withoutLeadingZero = cleaned.replace(/^0/, '');
  const normalized = withoutLeadingZero.replace(/^33/, '');
  return `+33${normalized}`;
};
