import org.apache.http.client.HttpClient;
import org.apache.http.client.ResponseHandler;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.impl.client.BasicResponseHandler;
import org.apache.http.impl.client.DefaultHttpClient;

import org.apache.http.entity.StringEntity;

import java.util.Scanner;
 
public class admin {

    private static String ADMIN_URL = "http://localhost:3000/admin/boot";

    //public static void main(String[] args) {
    public static void postUserSample() {
        Scanner in = new Scanner(System.in);

        System.out.println("\nYou are running the admin boot program. Please be careful\n");

        while (true) {
            // email and password are obtained from UI in actual app
            System.out.println("Enter information to remove a user from a chatroom");
            System.out.print("chat room: ");
                String room = in.nextLine();

            System.out.print("nickname: ");
                String nickname = in.nextLine();

            try {
                DefaultHttpClient client = new DefaultHttpClient();

                HttpPost postRequest = new HttpPost(ADMIN_URL);

                String queryData = "{\"room\":\"" + room + "\", \"nickname\":\"" + nickname + "\"}";

                postRequest.setEntity(new StringEntity(queryData));
                postRequest.setHeader("Accept", "application/json");
                postRequest.setHeader("Content-Type", "application/json");

                //System.out.println(queryData);

                ResponseHandler<String> responseHandler = new BasicResponseHandler();

                String result = client.execute(postRequest, responseHandler);
                System.out.println("\nResult: " + result + "\n");
            }
            catch (Exception e) {
                System.out.println(e.toString());
            }
        }

    }

    public static void main(String[] args) {
        admin.postUserSample();
    }
}
