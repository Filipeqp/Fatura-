import { NotFoundError } from "../lib/app-error.js";
import { cardRepository, type CardInput } from "../repositories/card.repository.js";

async function getOwnedCard(id: string, userId: string) {
  const card = await cardRepository.findByIdForUser(id, userId);
  if (!card) {
    throw new NotFoundError("Cartão não encontrado");
  }
  return card;
}

export const cardService = {
  list(userId: string) {
    return cardRepository.findManyByUser(userId);
  },

  get(id: string, userId: string) {
    return getOwnedCard(id, userId);
  },

  create(userId: string, data: CardInput) {
    return cardRepository.create(userId, data);
  },

  async update(id: string, userId: string, data: Partial<CardInput>) {
    await getOwnedCard(id, userId);
    return cardRepository.update(id, data);
  },

  async remove(id: string, userId: string) {
    await getOwnedCard(id, userId);
    await cardRepository.remove(id);
  },
};
