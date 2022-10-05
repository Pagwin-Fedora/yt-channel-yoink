use std::fs::File;
use std::io::Read;
pub fn main() -> std::io::Result<()> {
    const START:&str = "<opml version=\"1.1\"><body><outline text=\"Imported Youtube Subscriptions\" title=\"Imported Youtube Subscriptions\">";
    let mut file = File::open("channels")?;
    let mut buf:String = String::new();
    file.read_to_string(&mut buf)?;
    let middle = buf.split("\n")
        .filter(|v|v!=&"")
        .map(gen_middle)
        .collect::<Vec<String>>()
        .join("\n");
        
    const END:&str = "</outline></body></opml>";
    print!("{}\n{}\n{}",START,middle,END);

    Ok(())
}

fn gen_middle(line:&str)->String{
    let tokens = line.split(" ").filter(|v|v!=&"").map(String::from).collect::<Vec<String>>();
    let name = tokens[0..(tokens.len()-1)].join(" ");
    let id = tokens.last().unwrap();
    format!("<outline text=\"{}\" title=\"{}\" type=\"rss\" xmlUrl=\"/feed/channel/{}\"/>",name,name,id)
}
