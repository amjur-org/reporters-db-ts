#!/usr/bin/env node

/**
 * Convert Python regex patterns to PCRE-compatible patterns
 * Handles named capture group syntax and template variable substitution
 */

import fs from 'fs';
import path from 'path';

function convertNamedGroups(pattern) {
    // Convert Python named groups (?P<name>...) to PCRE (?<name>...)
    return pattern.replace(/\(\?P<([^>]+)>/g, '(?<$1>');
}

function resolveTemplateVariables(regexData) {
    const resolved = JSON.parse(JSON.stringify(regexData)); // deep clone
    
    // Build a flat map of all template variables
    const templateVars = {};
    
    function extractTemplates(obj, path = '') {
        for (const [key, value] of Object.entries(obj)) {
            if (key.endsWith('#')) continue; // skip comments
            
            if (typeof value === 'string' && !value.includes('$')) {
                // This is a base pattern - add it to templates
                const varName = path ? `${path}_${key}` : key;
                if (varName) {
                    templateVars[varName] = value;
                }
            } else if (typeof value === 'object') {
                extractTemplates(value, path ? `${path}_${key}` : key);
            }
        }
    }
    
    // First pass: extract all base patterns
    extractTemplates(resolved);
    
    // Add some known patterns that might be referenced
    templateVars['paragraph_marker_optional'] = resolved.paragraph_marker + '?';
    templateVars['edition'] = '$reporter'; // This needs to be resolved elsewhere
    
    function substituteVariables(obj) {
        for (const [key, value] of Object.entries(obj)) {
            if (key.endsWith('#')) continue; // skip comments
            
            if (typeof value === 'string') {
                let substituted = value;
                
                // Replace template variables
                for (const [varName, varPattern] of Object.entries(templateVars)) {
                    const regex = new RegExp(`\\$${varName}`, 'g');
                    substituted = substituted.replace(regex, varPattern);
                }
                
                obj[key] = substituted;
            } else if (typeof value === 'object') {
                substituteVariables(value);
            }
        }
    }
    
    // Second pass: substitute variables
    substituteVariables(resolved);
    
    return resolved;
}

function convertRegexes(inputFile, outputFile) {
    try {
        // Read the original file
        const rawData = fs.readFileSync(inputFile, 'utf8');
        const regexData = JSON.parse(rawData);
        
        // Step 1: Resolve template variables
        console.log('Resolving template variables...');
        const resolvedData = resolveTemplateVariables(regexData);
        
        // Step 2: Convert named capture groups
        console.log('Converting named capture groups...');
        function convertPatterns(obj) {
            for (const [key, value] of Object.entries(obj)) {
                if (key.endsWith('#')) continue; // skip comments
                
                if (typeof value === 'string') {
                    obj[key] = convertNamedGroups(value);
                } else if (typeof value === 'object') {
                    convertPatterns(value);
                }
            }
        }
        
        convertPatterns(resolvedData);
        
        // Step 3: Write the converted file
        const outputJson = JSON.stringify(resolvedData, null, 4);
        fs.writeFileSync(outputFile, outputJson);
        
        console.log(`✅ Conversion complete!`);
        console.log(`📁 Input:  ${inputFile}`);
        console.log(`📁 Output: ${outputFile}`);
        
        // Show some statistics
        const originalSize = rawData.length;
        const convertedSize = outputJson.length;
        console.log(`📊 Original: ${originalSize} bytes`);
        console.log(`📊 Converted: ${convertedSize} bytes`);
        
        return resolvedData;
        
    } catch (error) {
        console.error('❌ Error during conversion:', error.message);
        process.exit(1);
    }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
    const inputFile = process.argv[2] || './reporters_db/data/regexes.json';
    const outputFile = process.argv[3] || './regexes_pcre.json';
    
    console.log('🔄 Converting Python regexes to PCRE format...');
    convertRegexes(inputFile, outputFile);
}

export { convertNamedGroups, resolveTemplateVariables, convertRegexes };
