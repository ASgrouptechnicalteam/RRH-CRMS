import React from 'react';

export interface CardHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
}

export interface CardTitleProps {
  className?: string;
  children?: React.ReactNode;
}

export interface CardDescriptionProps {
  className?: string;
  children?: React.ReactNode;
}

export interface CardContentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface CardFooterProps {
  className?: string;
  children?: React.ReactNode;
}

export type CardVariant = 'default' | 'elevated' | 'outlined';

// Sub-component implementations
const CardHeader: React.ComponentType<CardHeaderProps> = ({
  title,
  subtitle
}) => (
  <div className="p-4 border-b">
    <h3 className="text-sm font-medium text-neutral-900">{title}</h3>
    {subtitle && <p className="text-xs text-neutral-500">{subtitle}</p>}
  </div>
);

CardHeader.displayName = 'Card.Header';

const CardTitle: React.ComponentType<CardTitleProps> = ({
  className,
  children
}) => <h3 className={className}>{children}</h3>;

CardTitle.displayName = 'Card.Title';

const CardDescription: React.ComponentType<CardDescriptionProps> = ({
  className,
  children
}) => <p className={className}>{children}</p>;

CardDescription.displayName = 'Card.Description';

const CardContent: React.ComponentType<CardContentProps> = ({
  className,
  children
}) => <div className="p-4">{children}</div>;

CardContent.displayName = 'Card.Content';

const CardFooter: React.ComponentType<CardFooterProps> = ({
  className,
  children
}) => (
  <div className="p-4 border-t">
    {children}
  </div>
);

CardFooter.displayName = 'Card.Footer';

// The Card compound component - typed with both props AND static sub-component properties
type CardComponentType = React.ComponentType<{
  variant?: CardVariant;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  Header?: React.ReactNode;
  Title?: React.ReactNode;
  Content?: React.ReactNode;
  Footer?: React.ReactNode;
}> & {
  Header: React.ComponentType<CardHeaderProps>;
  Title: React.ComponentType<CardTitleProps>;
  Description: React.ComponentType<CardDescriptionProps>;
  Content: React.ComponentType<CardContentProps>;
  Footer: React.ComponentType<CardFooterProps>;
};

const Card: CardComponentType = ({ variant = 'default', className, style, children, Header, Title, Content, Footer }) => {
  const cardClasses = `card rounded-md border border-transparent shadow-sm transition-all`;

  return (
    <div className={cardClasses + ' ' + className} style={style}>
      {Header && <CardHeader title={Header as React.ReactNode} subtitle="Subtitle" />}
      {Title && <CardTitle className={className}>{Title}</CardTitle>}
      {Content && <CardContent>{Content}</CardContent>}
      {Footer && <CardFooter>{Footer}</CardFooter>}
      {children}
    </div>
  );
};

// Attach sub-components for TypeScript recognition
Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;

export { Card };