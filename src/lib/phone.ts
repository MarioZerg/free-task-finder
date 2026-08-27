export const formatPhone = (raw: string) => {
  let digits = (raw || '').replace(/\D/g, '');
  if (digits.startsWith('8')) digits = `7${digits.slice(1)}`;
  if (!digits.startsWith('7')) digits = `7${digits}`;
  digits = digits.slice(0, 11);

  const rest = digits.slice(1);
  let out = '+7';
  if (rest.length) out += ` (${rest.slice(0, 3)}`;
  if (rest.length >= 3) out += ') ';
  if (rest.length > 3) out += rest.slice(3, 6);
  if (rest.length > 6) out += `-${rest.slice(6, 8)}`;
  if (rest.length > 8) out += `-${rest.slice(8, 10)}`;
  return out;
};

export const phoneDigits = (raw: string) => {
  let digits = (raw || '').replace(/\D/g, '');
  if (digits.startsWith('8')) digits = `7${digits.slice(1)}`;
  return digits.slice(0, 11);
};

export const isPhoneValid = (raw: string) => phoneDigits(raw).length === 11;
