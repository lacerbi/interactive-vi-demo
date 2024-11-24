import Head from 'next/head'
import InteractiveVI from '../components/InteractiveVI'

export default function Home() {
  return (
    <>
      <Head>
        <title>Interactive Variational Inference</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <InteractiveVI />
      </main>
    </>
  )
}