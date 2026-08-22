import { NotFoundError } from "../lib/app-error.js";
import { categoryRepository } from "../repositories/category.repository.js";

async function getOwnedCategory(id: string, userId: string) {
  const category = await categoryRepository.findByIdForUser(id, userId);
  if (!category) {
    throw new NotFoundError("Categoria não encontrada");
  }
  return category;
}

export const categoryService = {
  list(userId: string) {
    return categoryRepository.findManyByUser(userId);
  },

  seedDefaultsForUser(userId: string) {
    return categoryRepository.seedDefaults(userId);
  },

  seedMissingDefaults(userId: string) {
    return categoryRepository.seedMissingDefaults(userId);
  },

  create(userId: string, data: { name: string; color: string }) {
    return categoryRepository.create(userId, data);
  },

  async update(id: string, userId: string, data: Partial<{ name: string; color: string; monthlyBudget: number | null }>) {
    await getOwnedCategory(id, userId);
    return categoryRepository.update(id, data);
  },

  async remove(id: string, userId: string) {
    await getOwnedCategory(id, userId);
    await categoryRepository.remove(id);
  },

  async addRule(categoryId: string, userId: string, keyword: string) {
    await getOwnedCategory(categoryId, userId);
    return categoryRepository.createRule(userId, categoryId, keyword);
  },

  async removeRule(ruleId: string, userId: string) {
    const rule = await categoryRepository.findRuleForUser(ruleId, userId);
    if (!rule) {
      throw new NotFoundError("Palavra-chave não encontrada");
    }
    await categoryRepository.removeRule(ruleId);
  },
};
