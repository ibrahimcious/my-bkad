/**
 * Typed application errors.
 *
 * An `AppError` (and its subclasses) carries a `message` written in
 * Bahasa Indonesia that is safe to display to end users. Errors that
 * are not `AppError` instances must never have their message shown to
 * users — log them and present a generic message instead.
 */
export class AppError extends Error {
  constructor(message: string) {
    super(message)
    this.name = new.target.name
  }
}

/**
 * The uploaded LRA workbook could not be read, is missing required
 * columns, or contains no usable data.
 */
export class LRAParseError extends AppError {}
