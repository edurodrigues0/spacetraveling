import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { GetStaticPaths, GetStaticProps } from 'next';

import Head from 'next/head';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useMemo } from 'react';
import { useRouter } from 'next/router';
import styles from './post.module.scss';
import { getPrismicClient } from '../../services/prismic';
import commonStyles from '../../styles/common.module.scss';
import Header from '../../components/Header';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  const formattedDate = format(
    new Date(post.first_publication_date),
    'dd MMM yyyy',
    {
      locale: ptBR,
    }
  );

  const estimatedTimeToRead = useMemo(() => {
    if (router.isFallback) {
      return 0;
    }

    const wordsPerMinute = 200;

    const contentWords = post.data.content.reduce(
      (summedContents, currentContent) => {
        const headingWords = currentContent.heading.split(/\s/g).length;

        const bodyText = RichText.asText(currentContent.body);
        const bodyWords = bodyText.split(/\s/g).length;

        return summedContents + headingWords + bodyWords;
      },
      0
    );

    const minutes = contentWords / wordsPerMinute;
    const readTime = Math.ceil(minutes);

    return readTime;
  }, [post, router.isFallback]);

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <Head>
        <title>spacetraveling. | {post.data.title}</title>
      </Head>
      <Header />
      <img src={post.data.banner.url} className={styles.image} alt="banner" />
      <main className={`${styles.content} ${commonStyles.commonContainer}`}>
        <h1>{post.data.title}</h1>
        <div className={styles.infoContent}>
          <div>
            <FiCalendar size={20} />
            <time>{formattedDate}</time>
          </div>

          <div>
            <FiUser size={20} />
            <span>{post.data.author}</span>
          </div>

          <div>
            <FiClock size={20} />
            <span>{estimatedTimeToRead} min</span>
          </div>
        </div>

        {post.data.content.map(content => {
          return (
            <article className={styles.postContainer} key={content.heading}>
              <h2>{content.heading}</h2>

              <div
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </article>
          );
        })}
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'post'),
  ]);

  const paths = posts.results.map(post => ({
    params: { slug: post.uid },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();

  const response = await prismic.getByUID('post', String(slug), {});

  const post = response;

  // console.log(JSON.stringify(response, null, 2));

  /* const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
    },
    content: response.data.content.map(content => {
      return {
        heading: content.heading,
        body: [...content.body],
      };
    }),
  }; */

  return {
    props: {
      post,
    },
    revalidate: 60 * 60 * 30, // 30 minutes
  };
};
