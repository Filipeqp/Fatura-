export class AppError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Recurso não encontrado") {
    super(404, message);
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Não autenticado") {
    super(401, message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Acesso negado") {
    super(403, message);
    this.name = "ForbiddenError";
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflito com o estado atual do recurso") {
    super(409, message);
    this.name = "ConflictError";
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Requisição inválida") {
    super(400, message);
    this.name = "BadRequestError";
  }
}
