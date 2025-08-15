import { ModuleConfig, ModuleType } from '../types/document-view.types';

/**
 * Registry for module configurations
 * This allows each module to register its configuration with the centralized document-view system
 */
class ModuleConfigRegistryClass {
    private configs: Map<ModuleType, ModuleConfig> = new Map();

    /**
     * Register a module configuration
     */
    register(config: ModuleConfig): void {
        this.configs.set(config.moduleType, config);
    }

    /**
     * Get a module configuration
     */
    get(moduleType: ModuleType): ModuleConfig | undefined {
        return this.configs.get(moduleType);
    }

    /**
     * Check if a module is registered
     */
    has(moduleType: ModuleType): boolean {
        return this.configs.has(moduleType);
    }

    /**
     * Get all registered modules
     */
    getAll(): ModuleConfig[] {
        return Array.from(this.configs.values());
    }

    /**
     * Get all registered module types
     */
    getModuleTypes(): ModuleType[] {
        return Array.from(this.configs.keys());
    }

    /**
     * Validate that a module is registered
     */
    validateModule(moduleType: ModuleType): void {
        if (!this.has(moduleType)) {
            throw new Error(`Module '${moduleType}' is not registered. Please register the module configuration first.`);
        }
    }

    /**
     * Clear all registrations (mainly for testing)
     */
    clear(): void {
        this.configs.clear();
    }
}

// Export singleton instance
export const ModuleConfigRegistry = new ModuleConfigRegistryClass();

/**
 * Helper function to register a module configuration
 */
export function registerModuleConfig(config: ModuleConfig): void {
    ModuleConfigRegistry.register(config);
}

/**
 * Helper function to get a module configuration
 */
export function getModuleConfig(moduleType: ModuleType): ModuleConfig {
    const config = ModuleConfigRegistry.get(moduleType);
    if (!config) {
        throw new Error(`Module '${moduleType}' is not registered. Please register the module configuration first.`);
    }
    return config;
}
