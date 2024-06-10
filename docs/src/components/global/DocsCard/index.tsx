import * as React from 'react';

import Link from '@docusaurus/Link';
import clsx from 'clsx';
import styles from './styles.module.css';
import useBaseUrl from '@docusaurus/useBaseUrl';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  href?: string;
  header?: string;
  icon?: string;
  hoverIcon?: string;
  iconSet?: string;
  ionIcon?: string;
  img?: string;
  size?: 'md' | 'lg';
}

function DocsCard(props: Props): JSX.Element {
  const customClassName = props.className || '';
  const isStatic = typeof props.href === 'undefined';
  const isOutbound = typeof props.href !== 'undefined' ? /^http/.test(props.href) : false;
  const header = props.header === 'undefined' ? null : <header className="Card-header"><span>{props.header}</span><span>→</span></header>;
  const hoverIcon = props.hoverIcon || props.icon;

  const content = (
    <>
      {props.img && <img src={useBaseUrl(props.img)} className="Card-image" />}
      <div className="Card-container">
        {props.header && header}
        <div className="Card-content">{props.children}</div>
      </div>
    </>
  );

  const className = clsx({
    'Card-with-image': typeof props.img !== 'undefined',
    'Card-without-image': typeof props.img === 'undefined',
    'Card-size-lg': props.size === 'lg',
    [customClassName]: props.className,
  });

  if (isStatic) {
    return (
      <div className={className}>
        <div className={clsx(styles.card, 'docs-card')}>{content}</div>
      </div>
    );
  }

  if (isOutbound) {
    return (
      <div className={className}>
        <a className={clsx(styles.card, 'docs-card')} href={props.href} target="_blank">
          {content}
        </a>
      </div>
    );
  }

  return (
    <div className={className}>
      <Link to={props.href} className={clsx(styles.card, 'docs-card')}>
        {content}
      </Link>
    </div>
  );
}

export default DocsCard;
