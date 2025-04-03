/**
 * Hooks tipados para Redux
 * 
 * Proporciona hooks tipados para acceder al store de Redux
 * siguiendo las convenciones funcionales y de inmutabilidad
 */
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from './store';
import { RootState } from './rootReducer';

// Hooks tipados para usar en lugar de los hooks estándar de react-redux
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
