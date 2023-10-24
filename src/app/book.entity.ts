export class BookEntity {
  public Title: string | undefined;
  public Author: string | undefined;
  public Length: number | null | undefined;
  public PublishedDate: Date | null | undefined;

  public Reset(): void {
    this.Title = '';
    this.Author = '';
    this.Length = null;
    this.PublishedDate = null;
  }
}
