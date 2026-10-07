// Crisp, consistent icons from the Ionicons set bundled with Expo
// (@expo/vector-icons), wrapped so screens don't name glyphs directly.
import { Ionicons } from '@expo/vector-icons';
import React from 'react';

type P = { size?: number; color?: string };
type Name = React.ComponentProps<typeof Ionicons>['name'];

const make = (name: Name) =>
  function Icon({ size = 28, color = '#fff' }: P) {
    return <Ionicons name={name} size={size} color={color} />;
  };

export const PowerIcon = make('power');
export const MoonIcon = make('moon');
export const LockIcon = make('lock-closed');
export const WakeIcon = make('sunny');
export const MonitorIcon = make('desktop-outline');
export const PlusIcon = make('add');
export const ChevronIcon = make('chevron-forward');
export const TrashIcon = make('trash-outline');
export const CheckIcon = make('checkmark-circle');
export const CloseIcon = make('close');
