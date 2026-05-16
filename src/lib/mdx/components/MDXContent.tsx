import NextImage from 'next/image'
import { ImgHTMLAttributes } from 'react'
import ReactMarkdown, { Components } from 'react-markdown'

function ResponsiveImage(props: ImgHTMLAttributes<HTMLImageElement>): React.JSX.Element {
  return (
    <span className="responsive-img">
      <NextImage src={props.src as string} alt={props.alt || ''} fill />
    </span>
  )
}

const defaultComponents = {
  img: ResponsiveImage,
}

/**
 * Renders the given MDX content with the given components.
 */
export default function MDXContent({
  content,
  components,
}: {
  /**
   * The MDX content to render.
   */
  content: string | undefined
  /**
   * The components to use for rendering the MDX content.
   */
  components?: Components
}): React.JSX.Element | null {
  if (!content) return null

  components = components ? { ...defaultComponents, ...components } : defaultComponents

  return <ReactMarkdown components={components}>{content}</ReactMarkdown>
}
