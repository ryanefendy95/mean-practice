import { Injectable } from '@angular/core';
import { Post } from './post.model';
import { Subject } from 'rxjs'; // like EventEmitter
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class PostService {
  private posts: Post[] = [];
  private postsUpdated = new Subject<Post[]>();

  constructor(private http: HttpClient, private router: Router) {}

  // immutable
  getPosts(postsPerPage: number, currentPage: number) {
    const queryParams = `?pageSize=${postsPerPage}&page=${currentPage}`;
    this.http
      .get<{ message: string; posts: any }>(`http://localhost:3000/api/posts${queryParams}`)
      .pipe(
        map(postData => {
          return postData.posts.map(({ _id: id, title, content, imagePath }) => {
            return { id, title, content, imagePath };
          });
        })
      )
      .subscribe(posts => {
        this.posts = posts;
        this.postsUpdated.next([...this.posts]);
      });
  }

  getPostUpdatedListener() {
    return this.postsUpdated.asObservable();
  }

  addPosts(title: string, content: string, image: File) {
    const postData = new FormData();
    postData.append('title', title);
    postData.append('content', content);
    postData.append('image', image, title);
    this.http
      .post<{ message: string; post: Post }>('http://localhost:3000/api/posts', postData)
      .subscribe(({ post: { id, imagePath } }) => {
        const post: Post = { id, title, content, imagePath };
        this.posts.push(post);
        this.postsUpdated.next([...this.posts]);
        this.router.navigate(['/']);
      });
  }

  deletePost(postId: string) {
    this.http.delete(`http://localhost:3000/api/posts/${postId}`).subscribe(() => {
      this.posts = this.posts.filter((post: Post) => post.id !== postId);
      this.postsUpdated.next([...this.posts]);
    });
  }

  getPost(postId: string) {
    return this.http.get<{ _id: string; title: string; content: string; imagePath: string }>(
      `http://localhost:3000/api/posts/${postId}`
    );
  }

  updatePost(id: string, title: string, content: string, image: File | string) {
    let postData: Post | FormData;
    if (typeof image === 'object') {
      postData = new FormData();
      postData.append('id', id);
      postData.append('title', title);
      postData.append('content', content);
      postData.append('image', image, title);
    } else {
      postData = {
        id: id,
        title: title,
        content: content,
        imagePath: image,
      };
    }
    this.http.put('http://localhost:3000/api/posts/' + id, postData).subscribe(response => {
      const updatedPosts = [...this.posts];
      const oldPostIndex = updatedPosts.findIndex(p => p.id === id);
      const post: Post = {
        id: id,
        title: title,
        content: content,
        imagePath: '',
      };
      updatedPosts[oldPostIndex] = post;
      this.posts = updatedPosts;
      this.postsUpdated.next([...this.posts]);
      this.router.navigate(['/']);
    });
  }
}
