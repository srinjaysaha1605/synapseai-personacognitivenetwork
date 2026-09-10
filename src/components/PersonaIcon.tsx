import React from 'react';
import {
  GiDevilMask,
  GiThirdEye,
  Gi3dGlasses,
  GiArchitectMask,
  GiMagicSwirl,
  GiCyberEye,
} from 'react-icons/gi';
import {
  Flame,
  HelpCircle,
  ShieldAlert,
  Compass,
  BookOpen,
  Cpu,
  Sparkles,
  Zap,
  Terminal,
  BrainCircuit,
  Eye,
  Layers,
} from 'lucide-react';

interface PersonaIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const PersonaIcon: React.FC<PersonaIconProps> = ({ name, className = 'w-5 h-5', size }) => {
  const iconProps = { className, ...(size ? { size } : {}) };

  switch (name) {
    case 'GiDevilMask':
    case 'Flame':
      return <GiDevilMask {...iconProps} />;
    case 'GiThirdEye':
    case 'HelpCircle':
      return <GiThirdEye {...iconProps} />;
    case 'Gi3dGlasses':
    case 'ShieldAlert':
      return <Gi3dGlasses {...iconProps} />;
    case 'GiArchitectMask':
    case 'Compass':
      return <GiArchitectMask {...iconProps} />;
    case 'GiMagicSwirl':
    case 'BookOpen':
      return <GiMagicSwirl {...iconProps} />;
    case 'GiCyberEye':
    case 'Cpu':
      return <GiCyberEye {...iconProps} />;
    case 'Zap':
      return <Zap {...iconProps} />;
    case 'Terminal':
      return <Terminal {...iconProps} />;
    case 'BrainCircuit':
      return <BrainCircuit {...iconProps} />;
    case 'Eye':
      return <Eye {...iconProps} />;
    case 'Layers':
      return <Layers {...iconProps} />;
    default:
      return <Sparkles {...iconProps} />;
  }
};
