// Café opening hours — uniform across the week for now (09:00–23:00).
// Move to admin settings later if per-day hours are ever needed.
export const OPEN_HOUR = 9; // 09:00
export const CLOSE_HOUR = 23; // 23:00

export type OpenState = {
  isOpen: boolean;
  /** When the status next flips — used to show "until 11:00 PM" / "opens 9:00 AM". */
  changeAt: Date;
};

export function getOpenState(now: Date): OpenState {
  const minutes = now.getHours() * 60 + now.getMinutes();
  const open = OPEN_HOUR * 60;
  const close = CLOSE_HOUR * 60;
  const isOpen = minutes >= open && minutes < close;

  const changeAt = new Date(now);
  changeAt.setSeconds(0, 0);
  if (isOpen) {
    changeAt.setHours(CLOSE_HOUR, 0);
  } else {
    changeAt.setHours(OPEN_HOUR, 0);
    // Past closing time → the next opening is tomorrow morning.
    if (minutes >= close) changeAt.setDate(changeAt.getDate() + 1);
  }
  return { isOpen, changeAt };
}
