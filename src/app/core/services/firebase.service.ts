import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getDatabase, ref, onValue, Database, set, update, remove, push, get } from 'firebase/database';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { Todo } from '../models/todo.model';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { environment } from '../../../environments/environment';

const firebaseConfig = {
  apiKey: environment.firebaseConfig.apiKey,
  authDomain: environment.firebaseConfig.authDomain,
  projectId: environment.firebaseConfig.projectId,
  storageBucket: environment.firebaseConfig.storageBucket,
  messagingSenderId: environment.firebaseConfig.messagingSenderId,
  appId: environment.firebaseConfig.appId,
  measurementId: environment.firebaseConfig.measurementId,
  databaseURL: environment.firebaseConfig.databaseURL
};

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private app;
  private analytics;
  private database!: Database;
  private firebaseAvailable = true;
  
  private _todos = new BehaviorSubject<Todo[]>([]);
  public todos = this._todos.asObservable();
  
  private _loading = new BehaviorSubject<boolean>(true);
  public loading = this._loading.asObservable();
  
  constructor() {
    try {
      this._loading.next(true);
      this.app = initializeApp(firebaseConfig);
      this.analytics = getAnalytics(this.app);
      this.database = getDatabase(this.app);
      
      this.initFirebaseListener();
    } catch (error) {
      console.error('Firebase initialization error:', error);
      this.firebaseAvailable = false;
      this._loading.next(false);
    }
  }

  private initFirebaseListener(): void {
    if (!this.firebaseAvailable || !this.database) return;
    
    this.setupCollectionListener('todos', false);
    this.setupCollectionListener('completed_todos', true);
  }
  
  private setupCollectionListener(collectionName: string, isCompleted: boolean): void {
    const todosRef = ref(this.database, collectionName);
    onValue(todosRef, (snapshot) => {
      this.handleFirebaseData(snapshot.val(), isCompleted);
      if (isCompleted) {
        this._loading.next(false);
      }
    }, (error) => {
      console.error(`Firebase ${collectionName} access error:`, error);
      this.firebaseAvailable = false;
      this._loading.next(false);
    });
  }
  
  private handleFirebaseData(data: any, isCompleted: boolean): void {
    if (!data) return;
    
    const firebaseTodos: Todo[] = [];
    Object.keys(data).forEach(key => {
      const todoData = data[key];
      firebaseTodos.push({
        id: parseInt(key),
        title: todoData.title,
        description: todoData.description || "",
        completed: isCompleted,
        createdAt: new Date(todoData.createdAt),
        dueDate: new Date(todoData.dueDate || todoData.createdAt),
        imageUrl: todoData.imageUrl,
        completedAt: todoData.completedAt ? new Date(todoData.completedAt) : undefined
      });
    });
    
    const currentTodos = this._todos.getValue();
    const currentTodosFiltered = currentTodos.filter(t => 
      t.completed !== isCompleted
    );
    
    const mergedTodos = [...currentTodosFiltered, ...firebaseTodos];
    this._todos.next(mergedTodos);
  }
  
  private checkFirebaseAvailability(): void {
    if (!this.firebaseAvailable || !this.database) {
      throw new Error('Firebase is not available');
    }
  }
  
  private getCollectionName(completed: boolean): string {
    return completed ? 'completed_todos' : 'todos';
  }
  
  private async handleFirebaseOperation<T>(operation: () => Promise<T>, errorMessage: string): Promise<T> {
    this.checkFirebaseAvailability();
    
    try {
      this._loading.next(true);
      return await operation();
    } catch (error) {
      console.error(`${errorMessage}:`, error);
      throw error;
    } finally {
      this._loading.next(false);
    }
  }

  async addTodo(title: string, description: string = "", dueDate: Date = new Date(), imageUrl?: string): Promise<void> {
    return this.handleFirebaseOperation(async () => {
      const newTodo: Todo = {
        id: Date.now(),
        title,
        description,
        completed: false,
        createdAt: new Date(),
        dueDate,
        imageUrl
      };
      
      const todoRef = ref(this.database, `todos/${newTodo.id}`);
      
      await set(todoRef, {
        title: newTodo.title,
        description: newTodo.description,
        createdAt: newTodo.createdAt.toISOString(),
        dueDate: newTodo.dueDate.toISOString(),
        imageUrl: newTodo.imageUrl || null
      });
    }, 'Firebase add todo error');
  }

  async takePicture(): Promise<string | undefined> {
    try {
      if (this.isProbablySimulator()) {
        return this.getPlaceholderImage();
      }

      const permissionStatus = await Camera.checkPermissions();
      
      if (permissionStatus.camera !== 'granted' || permissionStatus.photos !== 'granted') {
        const requestedPermissions = await Camera.requestPermissions({
          permissions: ['camera', 'photos']
        });
        
        if (requestedPermissions.camera !== 'granted') {
          return this.getPlaceholderImage();
        }
      }
      
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: this.isIOS() ? CameraSource.Photos : CameraSource.Camera,
        width: 600
      });
      
      return image.dataUrl;
    } catch (error: any) {
      return this.getPlaceholderImage();
    }
  }
  
  private isProbablySimulator(): boolean {
    try {
      const platform = (window as any)?.Capacitor?.getPlatform?.();
      const isNative = (window as any)?.Capacitor?.isNativePlatform?.();
      
      if (platform === 'web') {
        return true;
      }
      
      if (platform === 'ios' && isNative === false) {
        return true;
      }
      
      const userAgent = navigator.userAgent.toLowerCase();
      if ((/iphone|ipad|ipod/.test(userAgent) && /mac/.test(userAgent)) || 
          userAgent.includes('xcode')) {
        return true;
      }
      
      if (!navigator.mediaDevices) {
        return true;
      }
      
      return false;
    } catch (err) {
      return true;
    }
  }
  
  private isIOS(): boolean {
    try {
      const platform = (window as any)?.Capacitor?.getPlatform?.();
      return platform === 'ios';
    } catch (err) {

      return /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    }
  }
  
  private getPlaceholderImage(): string {
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAMAAABHPGVmAAAAWlBMVEX///8Aru8Aru8Aru8Aru8Aru8Aru8Aru8Aru8Aru8Aru8Aru8Aru8Aru8Aru8Aru8Aru8Aru8Aru8Aru8Aru8Aru8Aru8Aru8Aru8Aru8Aru8Aru8Aru+16-TmAAAAHXRSTlMAECAwQFBgcICQoLDA0ODw/0CAEGCgsNDg8P+gwKNr4cYAAAEASURBVGje7dnLDoIwEIXhQaqgchUvKIrv/5pq4oaF2jZMOgvP/xY24Utnegq1Wq1Wq9V+oWmaN1qtjcShlUgcW4nEqZVInFuJRGklEjeJRLmXSKzPEokylkjcryUSN4nEXSJRJhKJMpVIPCQS5SkR6F3fz0lZ1rMoipnvuNRXk1X1e5LmWT7xFIeq3YiSNEnSscP0RbsNXYfdbjcM7N71YtEurCzL0ktYdC4L8+wjLD2TZdnrK9ZOZGHs9r/YeiorDDzFkrmse8sBYpmsdrTYeDBrjj0gxrK+6vQhspZ1ui4fQ1uwvuD4SbUF6yPOH3X7D8v+cGC1Wq1Wq9W+0wvrBhENlcXK9QAAAABJRU5ErkJggg==';
  }

  async updateTodo(id: number, updates: Partial<Todo>): Promise<void> {
    return this.handleFirebaseOperation(async () => {
      const currentTodos = this._todos.getValue();
      const todo = currentTodos.find(t => t.id === id);
      
      if (!todo) {
        throw new Error(`Todo with id ${id} not found`);
      }
      
      const isCompleted = updates.completed !== undefined ? updates.completed : todo.completed;
      const collectionName = this.getCollectionName(isCompleted);
      
      if (todo.completed !== isCompleted) {
        const oldCollectionName = this.getCollectionName(todo.completed);
        const oldTodoRef = ref(this.database, `${oldCollectionName}/${id}`);
        await remove(oldTodoRef);
        
        const newTodoRef = ref(this.database, `${collectionName}/${id}`);
        await set(newTodoRef, {
          title: updates.title || todo.title,
          description: updates.description || todo.description,
          createdAt: (updates.createdAt || todo.createdAt).toISOString(),
          dueDate: (updates.dueDate || todo.dueDate).toISOString(),
          imageUrl: updates.imageUrl || todo.imageUrl || null
        });
      } else {
        const todoRef = ref(this.database, `${collectionName}/${id}`);
        const updateData: any = {};
        
        if (updates.title !== undefined) updateData.title = updates.title;
        if (updates.description !== undefined) updateData.description = updates.description;
        if (updates.dueDate !== undefined) updateData.dueDate = updates.dueDate.toISOString();
        if (updates.imageUrl !== undefined) updateData.imageUrl = updates.imageUrl;
        
        await update(todoRef, updateData);
      }
    }, 'Firebase update todo error');
  }

  async updateTodoImage(id: number, imageUrl: string): Promise<void> {
    return this.updateTodo(id, { imageUrl });
  }

  async toggleTodoStatus(id: number): Promise<void> {
    return this.handleFirebaseOperation(async () => {
      const currentTodos = this._todos.getValue();
      const todo = currentTodos.find(t => t.id === id);
      
      if (!todo) {
        throw new Error(`Todo with id ${id} not found`);
      }
      
      const oldCollectionName = this.getCollectionName(todo.completed);
      const oldTodoRef = ref(this.database, `${oldCollectionName}/${id}`);
      const snapshot = await get(oldTodoRef);
      const todoData = snapshot.val();
      
      if (!todoData) {
        throw new Error(`Todo data not found in Firebase`);
      }
      
      await remove(oldTodoRef);
      
      if (!todo.completed) {
        todoData.completedAt = new Date().toISOString();
      } else {
        delete todoData.completedAt;
      }
      
      const newCollectionName = this.getCollectionName(!todo.completed);
      const newTodoRef = ref(this.database, `${newCollectionName}/${id}`);
      await set(newTodoRef, todoData);
      
      const updatedTodos = currentTodos.map(t => {
        if (t.id === id) {
          return {
            ...t,
            completed: !t.completed,
            completedAt: !t.completed ? new Date() : undefined
          };
        }
        return t;
      });
      this._todos.next(updatedTodos);
    }, 'Firebase toggle todo status error');
  }

  async deleteTodo(id: number): Promise<void> {
    return this.handleFirebaseOperation(async () => {
      const currentTodos = this._todos.getValue();
      const todoToDelete = currentTodos.find(t => t.id === id);
      
      if (todoToDelete) {
        const collectionName = this.getCollectionName(todoToDelete.completed);
        const todoRef = ref(this.database, `${collectionName}/${id}`);
        await remove(todoRef);
      }
    }, 'Firebase delete error');
  }
  
  async deleteFromFirebase(id: number): Promise<void> {
    return this.deleteTodo(id);
  }

  getCompletedTodos(): Observable<Todo[]> {
    return this.todos.pipe(
      map(todos => todos.filter(todo => todo.completed))
    );
  }

  getIncompleteTodos(): Observable<Todo[]> {
    return this.todos.pipe(
      map(todos => todos.filter(todo => !todo.completed))
    );
  }
} 