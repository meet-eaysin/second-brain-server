#!/usr/bin/env ts-node

/**
 * Test Script for Centralized Document-View System
 * 
 * This script validates that the centralized document-view system is working correctly
 * by testing module configurations and basic functionality.
 */

import { initializeModuleConfigurations } from '../configs';
import { ModuleConfigRegistry } from '../config/module-config-registry';
import { DocumentViewService } from '../services/document-view.service';

async function testSystem() {
    console.log('🧪 Testing Centralized Document-View System\n');

    try {
        // Initialize configurations
        console.log('1. Initializing module configurations...');
        initializeModuleConfigurations();
        console.log('   ✅ Module configurations initialized\n');

        // Test module registry
        console.log('2. Testing module registry...');
        const registeredModules = ModuleConfigRegistry.getModuleTypes();
        console.log(`   📋 Registered modules: ${registeredModules.join(', ')}`);
        
        if (registeredModules.length === 0) {
            throw new Error('No modules registered');
        }
        console.log('   ✅ Module registry working\n');

        // Test service
        console.log('3. Testing document view service...');
        const service = new DocumentViewService();

        // Test each registered module
        for (const moduleType of registeredModules) {
            console.log(`   Testing ${moduleType} module...`);
            
            // Test configuration retrieval
            const config = await service.getModuleConfig(moduleType);
            console.log(`     - Config: ${config.displayName} (${config.displayNamePlural})`);
            console.log(`     - Properties: ${config.data.defaultProperties.length}`);
            console.log(`     - Views: ${config.data.defaultViews.length}`);
            console.log(`     - Required props: ${config.data.requiredProperties.join(', ')}`);
            console.log(`     - Frozen props: ${config.data.frozenProperties.join(', ')}`);
            
            // Test frozen config
            const frozenConfig = await service.getFrozenConfig(moduleType);
            console.log(`     - Frozen properties: ${frozenConfig.frozenProperties.length}`);
            
            console.log(`     ✅ ${moduleType} module configuration valid`);
        }
        console.log('   ✅ All module configurations valid\n');

        // Test configuration validation
        console.log('4. Testing configuration validation...');
        
        for (const moduleType of registeredModules) {
            const config = await service.getModuleConfig(moduleType);
            
            // Validate required fields
            if (!config.moduleType || !config.displayName || !config.displayNamePlural) {
                throw new Error(`Invalid configuration for ${moduleType}: missing required fields`);
            }
            
            // Validate properties
            if (!Array.isArray(config.data.defaultProperties)) {
                throw new Error(`Invalid configuration for ${moduleType}: defaultProperties must be an array`);
            }
            
            // Validate views
            if (!Array.isArray(config.data.defaultViews)) {
                throw new Error(`Invalid configuration for ${moduleType}: defaultViews must be an array`);
            }
            
            // Check for default view
            const hasDefaultView = config.data.defaultViews.some(view => view.isDefault);
            if (!hasDefaultView) {
                console.log(`     ⚠️  Warning: ${moduleType} has no default view`);
            }
            
            // Validate property IDs are unique
            const propertyIds = config.data.defaultProperties.map(p => p.id);
            const uniquePropertyIds = new Set(propertyIds);
            if (propertyIds.length !== uniquePropertyIds.size) {
                throw new Error(`Invalid configuration for ${moduleType}: duplicate property IDs`);
            }
            
            // Validate view IDs are unique
            const viewIds = config.data.defaultViews.map(v => v.id);
            const uniqueViewIds = new Set(viewIds);
            if (viewIds.length !== uniqueViewIds.size) {
                throw new Error(`Invalid configuration for ${moduleType}: duplicate view IDs`);
            }
            
            console.log(`     ✅ ${moduleType} configuration validation passed`);
        }
        console.log('   ✅ All configurations valid\n');

        // Test error handling
        console.log('5. Testing error handling...');
        try {
            await service.getModuleConfig('invalid' as any);
            throw new Error('Should have thrown error for invalid module');
        } catch (error: any) {
            if (error.message.includes('not registered')) {
                console.log('     ✅ Error handling for invalid module works');
            } else {
                throw error;
            }
        }
        console.log('   ✅ Error handling working\n');

        // Summary
        console.log('🎉 All tests passed!');
        console.log('\n📊 Summary:');
        console.log(`   - Modules registered: ${registeredModules.length}`);
        console.log(`   - Total properties: ${registeredModules.reduce((sum, moduleType) => {
            const config = ModuleConfigRegistry.get(moduleType);
            return sum + (config?.data.defaultProperties.length || 0);
        }, 0)}`);
        console.log(`   - Total views: ${registeredModules.reduce((sum, moduleType) => {
            const config = ModuleConfigRegistry.get(moduleType);
            return sum + (config?.data.defaultViews.length || 0);
        }, 0)}`);
        
        console.log('\n✅ Centralized Document-View System is ready for use!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

// Run the test if this script is executed directly
if (require.main === module) {
    testSystem().catch(console.error);
}

export { testSystem };
