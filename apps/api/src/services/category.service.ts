import { categoryRepository } from "../repositories/category.repository.js";

export const categoryService = {
  list(userId: string) {
    return categoryRepository.findManyByUser(userId);
  },

  seedDefaultsForUser(userId: string) {
    return categoryRepository.seedDefaults(userId);
  },

  create(userId: string, data: { name: string; color: string }) {
    return categoryRepository.create(userId, data);
  },
};
