import { FiCalendar, FiUser } from 'react-icons/fi';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useState } from 'react';
import Header from '../components/Header';
import commonStyles from '../styles/common.module.scss';
import { getPrismicClient } from '../services/prismic';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState(postsPagination);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  console.log('proxima pagina:', posts.next_page);

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  async function handleLoadMorePosts() {
    const data = await fetch(posts.next_page).then(response => response.json());
    setPosts({
      next_page: data.next_page,
      results: [...posts.results, ...data.results],
    });
  }

  return (
    <>
      <Head>
        <title>Home | spacetraveling.</title>
      </Head>
      <Header />

      <main className={`${styles.container} ${commonStyles.commonContainer}`}>
        {posts.results.map(post => (
          <div key={post.uid} className={styles.postContainer}>
            <Link href={`/post/${post.uid}`}>
              <a>
                <h1>{post.data.title}</h1>
                <p>{post.data.subtitle}</p>
                <div className={styles.information}>
                  <FiCalendar size={20} />
                  <time>
                    {format(
                      new Date(post.first_publication_date),
                      'dd MMM yyyy',
                      {
                        locale: ptBR,
                      }
                    )}
                  </time>
                  <FiUser size={20} />
                  <p>{post.data.author}</p>
                </div>
              </a>
            </Link>
          </div>
        ))}
        {posts.next_page !== null ? (
          <button type="button" onClick={handleLoadMorePosts}>
            <h3>Carregar mais posts</h3>
          </button>
        ) : (
          ''
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query([], {
    fetch: ['post.title', 'post.subtitle', 'post.author', 'post.slugs'],
    pageSize: 1,
  });
  // console.log(JSON.stringify(postsResponse, null, 2));
  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });
  const postsPagination = {
    results: posts,
    next_page: postsResponse.next_page,
  };
  return {
    props: {
      postsPagination,
    },
  };
};
