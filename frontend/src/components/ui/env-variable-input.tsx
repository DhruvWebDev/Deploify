import React, { useState, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, X } from 'lucide-react';

interface EnvVariablesInputProps {
  env: Record<string, string>;
  setEnv: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export function EnvVariablesInput({ env, setEnv }: EnvVariablesInputProps) {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const parseEnvVariables = useCallback((input: string): Record<string, string> => {
    const lines = input.split(/\r?\n/);
    const result: Record<string, string> = {};
    lines.forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        value = value.trim();
        result[key] = value;
      }
    });
    return result;
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, key?: string) => {
    const { value } = e.target;
    const parsedEnv = parseEnvVariables(value);

    if (Object.keys(parsedEnv).length > 0) {
      setEnv(prev => ({ ...prev, ...parsedEnv }));
      if (key) {
        setNewKey('');
        setNewValue('');
      } else {
        e.target.value = '';
      }
    } else if (key) {
      setEnv(prev => ({ ...prev, [key]: value }));
    }
  }, [setEnv, parseEnvVariables]);

  const addVariable = useCallback(() => {
    if (newKey && newValue) {
      setEnv(prev => ({ ...prev, [newKey]: newValue }));
      setNewKey('');
      setNewValue('');
    }
  }, [newKey, newValue, setEnv]);

  const removeVariable = useCallback((keyToRemove: string) => {
    setEnv(prev => {
      const newEnv = { ...prev };
      delete newEnv[keyToRemove];
      return newEnv;
    });
  }, [setEnv]);

  return (
    <div className="space-y-4">
      <ScrollArea className="h-[300px] rounded-md border p-4">
        {Object.entries(env).map(([key, value]) => (
          <div key={key} className="flex items-center space-x-2 mb-2">
            <Input
              placeholder="KEY"
              value={key}
              onChange={(e) => handleInputChange(e, key)}
              className="flex-1"
            />
            <Input
              placeholder="VALUE"
              value={value}
              onChange={(e) => handleInputChange(e, key)}
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeVariable(key)}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </ScrollArea>
      <div className="flex items-center space-x-2">
        <Input
          placeholder="New KEY"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          className="flex-1"
        />
        <Input
          placeholder="New VALUE"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          className="flex-1"
        />
        <Button onClick={addVariable} className="shrink-0">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Tip: You can paste multiple environment variables (KEY=VALUE format) into any input field.
      </p>
    </div>
  );
}

