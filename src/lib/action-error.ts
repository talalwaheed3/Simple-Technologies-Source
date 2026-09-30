/** Safe, deliberately authored messages that may be returned to a browser. */
export class ActionError extends Error {
  constructor(
    message: string,
    public status = 400,
    public fields?: Record<string, string[]>,
  ) {
    super(message);
  }
}
