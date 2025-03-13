import { PgColumn, PgTable } from 'drizzle-orm/pg-core';
import fs from 'fs';
import path from 'path';
import users from '../shared/schema';

// Helper function to convert snake_case to PascalCase
function toPascalCase(str: string): string {
    return str
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
}

function generateTypes(table: any) {
    // Use "users" as the hardcoded table name
    const tableName = 'users';
    const pascalCaseTableName = toPascalCase(tableName);

    // Filter out non-column properties
    const columns = Object.entries(table).filter(
        ([key]) =>
            typeof key === 'string' &&
            !key.startsWith('_') &&
            !key.startsWith('Symbol(') &&
            key !== 'enableRLS'
    );

    const userType = `export type ${pascalCaseTableName} = {\n${columns
        .map(([columnName, column]: [string, any]) => {
            // Generate type based on column.dataType
            let type = 'any';
            if (column.dataType === 'string') {
                type = 'string';
            } else if (column.dataType === 'date') {
                type = 'Date';
            } else if (column.dataType === 'boolean') {
                type = 'boolean';
            }

            // Handle nullability
            if (!column.notNull && columnName !== 'twoFactorEnabled') {
                return `  ${columnName}: ${type} | null;`;
            }

            return `  ${columnName}: ${type};`;
        })
        .join('\n')}\n};`;

    const newUserType = `export type New${pascalCaseTableName} = {\n${columns
        .map(([columnName, column]: [string, any]) => {
            // Generate type based on column.dataType
            let type = 'any';
            if (column.dataType === 'string') {
                type = 'string';
            } else if (column.dataType === 'date') {
                type = 'Date';
            } else if (column.dataType === 'boolean') {
                type = 'boolean';
            }

            // Make optional if has default or is nullable (except twoFactorEnabled)
            if (
                column.hasDefault ||
                (!column.notNull && columnName !== 'twoFactorEnabled')
            ) {
                if (!column.notNull && columnName !== 'twoFactorEnabled') {
                    return `  ${columnName}?: ${type} | null;`;
                }
                return `  ${columnName}?: ${type};`;
            }

            return `  ${columnName}: ${type};`;
        })
        .join('\n')}\n};`;

    return `${userType}\n\n${newUserType}`;
}

const generatedTypes = generateTypes(users);

// Write the generated types to shared/types.ts
const outputPath = path.resolve(__dirname, '../shared/types.ts');
fs.writeFileSync(outputPath, generatedTypes);

console.log(`Successfully generated types in ${outputPath}`);
