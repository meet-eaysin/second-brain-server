/**
 * Dependency graph management utilities for formula relationships
 */
export const dependencyGraphUtils = {
  /**
   * Update dependency graph with new formula dependencies
   */
  updateDependencyGraph: (
    dependencyGraph: Map<string, Set<string>>,
    recordId: string,
    dependencies: string[]
  ): void => {
    if (!dependencyGraph.has(recordId)) {
      dependencyGraph.set(recordId, new Set());
    }

    const recordDeps = dependencyGraph.get(recordId)!;
    dependencies.forEach(dep => recordDeps.add(dep));
  },

  /**
   * Get all formulas that depend on changed properties
   */
  getDependentFormulas: (
    dependencyGraph: Map<string, Set<string>>,
    changedProperties: string[]
  ): Set<string> => {
    const dependents = new Set<string>();

    // Find all formulas that depend on the changed properties
    for (const [formulaRecordId, deps] of dependencyGraph.entries()) {
      if (changedProperties.some(prop => deps.has(prop))) {
        dependents.add(formulaRecordId);
      }
    }

    return dependents;
  },

  /**
   * Clear dependency graph
   */
  clearDependencyGraph: (dependencyGraph: Map<string, Set<string>>): void => {
    dependencyGraph.clear();
  },

  /**
   * Remove formula from dependency graph
   */
  removeFromDependencyGraph: (
    dependencyGraph: Map<string, Set<string>>,
    recordId: string
  ): void => {
    dependencyGraph.delete(recordId);
  },

  /**
   * Get dependencies for a specific formula
   */
  getFormulaDependencies: (
    dependencyGraph: Map<string, Set<string>>,
    recordId: string
  ): string[] => {
    return Array.from(dependencyGraph.get(recordId) || []);
  }
};
