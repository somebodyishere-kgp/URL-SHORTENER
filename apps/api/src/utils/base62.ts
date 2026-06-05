const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function toBase62(value: number): string {
  if (value === 0) return ALPHABET[0];

  let remaining = value;
  let encoded = "";

  while (remaining > 0) {
    encoded = ALPHABET[remaining % 62] + encoded;
    remaining = Math.floor(remaining / 62);
  }

  return encoded;
}
