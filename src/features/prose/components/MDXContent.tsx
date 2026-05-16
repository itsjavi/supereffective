import Button from '@/lib/components/Button'
import PluginMDXContent from '@/lib/mdx/components/MDXContent'

const mdxComponents = {
  button: Button,
}

export default function MDXContent({ content }: { content: string | undefined }): React.JSX.Element | null {
  if (!content) return null

  return <PluginMDXContent components={mdxComponents} content={content} />
}
